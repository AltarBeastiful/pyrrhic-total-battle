/**
 * **The thrifty stop** — a candidate fifth stop read off the march horizon (`232-the-march-horizon.json`), no new
 * search and no engine call (the owner, 2026-10-14: *"maybe we're building another sweet spot with training time in
 * view … optimize dmg/silver, dmg/merc while keeping training time down and less important dmg/gold … keep the
 * order, … this row be the exact burn of the sweet spot or lower"*).
 *
 * The rule, on one army's horizon, against its sweet spot:
 *
 *  1. the pool is the rows the bar could have offered and did not — undominated ∧ in the band ∧ not a stop ∧ not a
 *     put-back generator (the generator is a stop one pass earlier);
 *  2. **burn** no more than the sweet spot's (`burn`; the first rule is `0`, the rated ones go up to the next stop's);
 *  3. **damage** below the sweet spot's: the stop sits under it on the bar, as the order wants;
 *  4. **queue** at least `queueCut` shorter than the sweet spot's: training time down is the point of the stop;
 *  5. **damage a silver** and **damage a merc** at least `silverFloor` / `mercFloor` of the sweet spot's: the two ratios
 *     the owner optimises are held, within a small tolerance. Gold is not gated (the monsters are the bread and
 *     butter); it is reported;
 *  6. of what is left, by rule: **the most damage** (`thrifty`), or **the elbow of the climb** from the next stop
 *     down to the sweet spot (`stone`, which also asks the pick to lie strictly between them in damage and queue).
 *     Ties: more damage, better damage a gold.
 *
 * Nothing is chosen when the gates leave no row; the funnel says which gate emptied the pool.
 *
 * Whether the bar could carry the pick is read, not assumed: `order` (S-61, `plan-report.ts` `CRITERIA`) wants the
 * stops, `all-in` apart, to rise strictly in burn and in damage — a pick at the sweet spot's own burn *ties* it,
 * which the criterion as written refuses. The verdict says `strict`, `tie-burn` (burn level shared, damage rises)
 * or `breaks`. `noStopBeaten` is read on the campaigns, as the criterion reads it.
 */
import { CAMPAIGN } from '../../src/config';
import type { Bill, MarkerRates } from '../../src/engine/rating';
import { rate } from '../../src/engine/rating';
import type { ArmyHorizon, HorizonRow } from './march-horizon';
import { fmt, short } from './plan-report';

export interface ThriftyRule {
  /**
   * Burn allowed: a number is chunks above the sweet spot's; `'below-next-stop'` is strictly below the burn of the
   * next stop up (the one above the sweet spot in damage, `all-in` included), so the pick may burn more than the sweet
   * spot while staying under what the next rung asks. With no stop up it is the sweet spot's own burn.
   */
  burn: number | 'below-next-stop';
  /** The share of the sweet spot's queue the pick must save. */
  queueCut: number;
  /** The share of the sweet spot's damage a silver the pick must keep. */
  silverFloor: number;
  /** The share of the sweet spot's damage a merc the pick must keep. */
  mercFloor: number;
  /**
   * A stepping stone: the pick's damage **and** queue lie strictly between the next stop down's (the one below the
   * sweet spot in damage, `all-in` apart) and the sweet spot's, so it fills the gap on both axes.
   */
  stone: boolean;
  /**
   * What is taken of the rows that pass: `damage` — the most damage; `rated` — the best `rate(sweet spot, row)` under
   * `rates` (the owner's rating: damage change plus every cost saved over its rate), so the weight of a cost is the
   * rate it is given, and only a row it rates above the sweet spot is taken; `knee` — the same pool (only rows the
   * rating prefers to the sweet spot), but of them **the elbow of the climb** from the next stop down to the sweet spot:
   * the row where the share of the damage gap closed most outruns the share of the queue gap spent (both linear; no
   * stop down: from nothing). The rating then decides who is admitted and the elbow who is taken, so a heavy queue
   * weight cannot drag the pick to the deepest cut. Ties go to the more damage, then the better damage a gold.
   */
  take: 'damage' | 'rated' | 'knee';
  /** The rates `rated` reads; the app's own `markerRates` when unset. */
  rates?: MarkerRates;
  /**
   * **Every cost improves** (the owner's first request, 2026-10-14: *"a march that improved all criteria while taking a
   * bit more merc"*): silver and queue strictly below the sweet spot's, gold and dragon coins at most `goldTolerance`
   * above it (a share: `0.05` is 5 %). The damage is then free to fall — or rise — and the burn to climb, up to the burn
   * limit. Unset, no cost is gated beyond the ones above.
   */
  allCosts?: { goldTolerance: number };
  /** `any`: the pick may out-damage the sweet spot (it then replaces it); `below` (the default): it sits under it. */
  damage?: 'below' | 'any';
  /** The share of the sweet spot's damage a pick must keep at least (`CAMPAIGN.planFixes.fifthStop.damageFloor`); none when unset. */
  damageFloor?: number;
}

/** The first rule: burn no higher than the sweet spot's, queue ≥ 10 % shorter, the most damage. Kept for comparison. */
export const THRIFTY: ThriftyRule = {
  burn: 0,
  queueCut: 0.1,
  silverFloor: 0.95,
  mercFloor: 0.95,
  stone: false,
  take: 'damage',
};

/**
 * The rated stone (the owner, 2026-10-14: *"burn below the next stop up … not the 10 % below training time … the best
 * row for all criteria including training time … just changing a bit the weight of training time"*). A stepping stone
 * between the next stop down and the sweet spot, burn strictly below the next stop up's, both ratios within 5 % of the
 * sweet spot's, no queue gate; of what passes, **the best owner's rating against the sweet spot**, with the weight of
 * the queue (`rates.seconds`, percent of queue worth one percent of damage — the lower, the heavier) and of gold
 * (`GOLD_RATE`, doubled: the monsters are the bread and butter) set here.
 */
export const GOLD_RATE = 10;
export const ratedRule = (
  seconds: number,
  silverFloor = 0.95,
  mercFloor = 0.95,
  queueCut = 0,
  take: 'rated' | 'knee' = 'rated',
): ThriftyRule => ({
  burn: 'below-next-stop',
  queueCut,
  silverFloor,
  mercFloor,
  stone: true,
  take,
  rates: { ...CAMPAIGN.markerRates, gold: GOLD_RATE, seconds },
});

/**
 * The all-costs improver (the owner's first request): the march that beats the sweet spot on silver, queue, gold and
 * coins, on damage a silver and damage a merc, while taking more burn and giving up some damage. Burn up to below the
 * next stop up's, queue strictly shorter, silver no higher, gold and coins within `goldTolerance`, both ratios at least
 * the sweet spot's, damage at least `damageFloor` of its; of what passes, the most damage. Every default is
 * `CAMPAIGN.planFixes.fifthStop` (`src/config.ts`).
 */
export const improverRule = (
  goldTolerance: number = CAMPAIGN.planFixes.fifthStop.goldTolerance,
  burn: ThriftyRule['burn'] = 'below-next-stop',
  damageFloor: number = CAMPAIGN.planFixes.fifthStop.damageFloor,
): ThriftyRule => ({
  burn,
  queueCut: 0,
  silverFloor: CAMPAIGN.planFixes.fifthStop.silverFloor,
  mercFloor: CAMPAIGN.planFixes.fifthStop.mercFloor,
  stone: false,
  take: 'damage',
  allCosts: { goldTolerance },
  damage: 'any',
  damageFloor,
});

/** The four ratios the bar prints, `Infinity` for a bill of nothing. */
export interface Ratios {
  silver: number;
  merc: number;
  gold: number;
  coin: number;
}

export const ratiosOf = (r: HorizonRow): Ratios => ({
  silver: r.silver > 0 ? r.worst / r.silver : Infinity,
  merc: r.hiredDamage / Math.max(1, r.hired),
  gold: r.gold > 0 ? r.worst / r.gold : Infinity,
  coin: r.coins > 0 ? r.worst / r.coins : Infinity,
});

/** How many rows survive each gate, in order. */
export interface Funnel {
  pool: number;
  burn: number;
  below: number;
  queue: number;
  silver: number;
  merc: number;
  /** `allCosts` rules only: of those, the rows whose gold and coins stay within the tolerance. */
  costs: number;
  /** `rated` rules only: of those, the rows the owner's rating prefers to the sweet spot (rate above zero). */
  rated: number;
}

export type OrderVerdict = 'strict' | 'tie-burn' | 'breaks';

export interface ThriftyResult {
  label: string;
  rule: ThriftyRule;
  /** No pick when the army has no sweet spot or the gates leave nothing. */
  sweet?: HorizonRow | undefined;
  pick?: HorizonRow | undefined;
  funnel: Funnel;
  /** The bar with the pick added: `order` and `noStopBeaten`. Absent without a pick. */
  order?: OrderVerdict | undefined;
  noStopBeaten?: boolean | undefined;
}

const stopsOf = (army: ArmyHorizon): HorizonRow[] => army.rows.filter((r) => r.marks.stop !== undefined);

/** The `order` criterion on the bar with `extra` added: strict, a tie in burn with rising damage, or broken. */
export function orderOf(stops: HorizonRow[], extra: HorizonRow): OrderVerdict {
  const rungs = [...stops.filter((s) => s.marks.stop !== 'all-in'), extra].sort(
    (a, b) => a.hired - b.hired || a.silver - b.silver || a.worst - b.worst,
  );
  let tie = false;
  for (let i = 1; i < rungs.length; i += 1) {
    const p = rungs[i - 1] as HorizonRow;
    const c = rungs[i] as HorizonRow;
    if (c.worst <= p.worst || c.hired < p.hired) return 'breaks';
    if (c.hired === p.hired) tie = true;
  }
  return tie ? 'tie-burn' : 'strict';
}

/** `noStopBeaten` on the campaigns, as `plan-report.ts` reads it, with `extra` added to the bar. */
export function noStopBeaten(stops: HorizonRow[], extra: HorizonRow): boolean {
  const bar = [...stops, extra];
  const pickOf = (r: HorizonRow): string => r.marks.stop ?? 'extra';
  for (const stop of bar)
    for (const other of bar) {
      if (other === stop) continue;
      if (
        pickOf(other) === 'all-in' ||
        (pickOf(stop) === 'all-in' && other.campaign.mercLost >= stop.campaign.mercLost)
      )
        continue;
      const o = other.campaign;
      const s = stop.campaign;
      if (
        o.totalDamage >= s.totalDamage &&
        o.silver <= s.silver &&
        o.mercLost <= s.mercLost &&
        (o.totalDamage > s.totalDamage || o.silver < s.silver || o.mercLost < s.mercLost)
      )
        return false;
    }
  return true;
}

/** The thrifty stop of one army under `rule`. Pure: reads the horizon, battles nothing. */
export function thriftyStop(army: ArmyHorizon, rule: ThriftyRule = THRIFTY): ThriftyResult {
  const funnel: Funnel = { pool: 0, burn: 0, below: 0, queue: 0, silver: 0, merc: 0, costs: 0, rated: 0 };
  const stops = stopsOf(army);
  const sweet = stops.find((s) => s.marks.stop === 'sweet-spot');
  if (!sweet) return { label: army.label, rule, funnel };
  const base = ratiosOf(sweet);

  const pool = army.rows.filter((r) => r.marks.fifthCandidate && r.marks.generatorOf === undefined);
  funnel.pool = pool.length;
  const up = stops
    .filter((s) => s.worst > sweet.worst)
    .sort((a, b) => a.hired - b.hired || a.worst - b.worst)[0];
  const limit = rule.burn === 'below-next-stop' ? (up ? up.hired - 1 : sweet.hired) : sweet.hired + rule.burn;
  const burn = pool.filter((r) => r.hired <= limit);
  funnel.burn = burn.length;
  // The next stop down: the highest-damage stop under the sweet spot (`all-in` is off the staircase).
  const lower = stops
    .filter((s) => s.marks.stop !== 'all-in' && s.worst < sweet.worst)
    .sort((a, b) => b.worst - a.worst)[0];
  const below = burn.filter(
    (r) =>
      (rule.damage === 'any' || r.worst < sweet.worst) &&
      (rule.damageFloor === undefined || r.worst >= sweet.worst * rule.damageFloor) &&
      (!rule.stone ||
        !lower ||
        (r.worst > lower.worst && r.seconds > lower.seconds && r.seconds < sweet.seconds)),
  );
  funnel.below = below.length;
  const queue = below.filter((r) => r.seconds <= sweet.seconds * (1 - rule.queueCut));
  funnel.queue = queue.length;
  const silver = queue.filter((r) => ratiosOf(r).silver >= base.silver * rule.silverFloor);
  funnel.silver = silver.length;
  const merc = silver.filter((r) => ratiosOf(r).merc >= base.merc * rule.mercFloor);
  funnel.merc = merc.length;
  const tol = rule.allCosts?.goldTolerance;
  const costed =
    tol === undefined
      ? merc
      : merc.filter(
          (r) =>
            r.silver <= sweet.silver &&
            r.seconds < sweet.seconds &&
            r.gold <= sweet.gold * (1 + tol) + 1e-9 &&
            r.coins <= sweet.coins * (1 + tol) + 1e-9,
        );
  funnel.costs = costed.length;

  const billOf = (r: HorizonRow): Bill => ({
    damage: r.worst,
    silver: r.silver,
    gold: r.gold,
    hired: r.hired,
    dragonCoins: r.coins,
    seconds: r.seconds,
  });
  const rates = rule.rates ?? CAMPAIGN.markerRates;
  const rated = (r: HorizonRow): number => rate(billOf(sweet), billOf(r), rates);
  /** The damage share of the climb closed, less the queue share spent: the height above the chord. */
  const knee = (r: HorizonRow): number => {
    const d0 = lower?.worst ?? 0;
    const q0 = lower?.seconds ?? 0;
    return (
      (r.worst - d0) / Math.max(1, sweet.worst - d0) - (r.seconds - q0) / Math.max(1, sweet.seconds - q0)
    );
  };
  const goldRatio = (r: HorizonRow): number => (r.gold > 0 ? r.worst / r.gold : Infinity);
  const byRule = (a: HorizonRow, b: HorizonRow): number =>
    (rule.take === 'rated' ? rated(b) - rated(a) : rule.take === 'knee' ? knee(b) - knee(a) : 0) ||
    b.worst - a.worst ||
    (goldRatio(b) > goldRatio(a) ? 1 : goldRatio(b) < goldRatio(a) ? -1 : 0) ||
    a.seconds - b.seconds;
  // A rated pick must be a better trade than the sweet spot in the owner's own rating, or it is not worth a stop.
  const good = rule.take !== 'damage' ? costed.filter((r) => rated(r) > 0) : costed;
  funnel.rated = good.length;
  const pick = [...good].sort(byRule)[0];
  return {
    label: army.label,
    rule,
    sweet,
    funnel,
    ...(pick ? { pick, order: orderOf(stops, pick), noStopBeaten: noStopBeaten(stops, pick) } : {}),
  };
}

// ---- the markdown ---------------------------------------------------------------------------------------

export const duration = (seconds: number): string => {
  const hours = Math.round(seconds / 3600);
  return hours >= 24 ? `${String(Math.floor(hours / 24))} d ${String(hours % 24)} h` : `${String(hours)} h`;
};
export const sign = (v: number): string => `${v > 0 ? '+' : ''}${fmt(v, 1)}`;
export const ratio = (v: number): string => (Number.isFinite(v) ? fmt(v, v < 100 ? 2 : 0) : '∞');

export const TABLE_HEAD =
  '| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |\n' +
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|';

/** The rates the tables' `rating` column reads: the rated rules' own (queue 40, gold 10). */
const DISPLAY_RATES: MarkerRates = { ...CAMPAIGN.markerRates, gold: 10 };

/** The owner's rating of a row against the sweet spot, in the table's rates. */
export const ratingOfRow = (sweet: HorizonRow, r: HorizonRow, rates: MarkerRates = DISPLAY_RATES): number =>
  rate(billOfRow(sweet), billOfRow(r), rates);

export const tableRow = (name: string, r: HorizonRow, sweet: HorizonRow): string => {
  const q = ratiosOf(r);
  return (
    `| ${name} | ${fmt(r.worst)} | ${fmt(r.silver)} | ${String(r.hired)} | ${fmt(r.gold)} | ${fmt(r.coins)} | ` +
    `${duration(r.seconds)} | ${ratio(q.silver)} | ${ratio(q.merc)} | ${ratio(q.gold)} | ${ratio(q.coin)} | ${fmt(ratingOfRow(sweet, r), 1)} |`
  );
};

/** What the pick is against the sweet spot, one line: percent change and the ratio multipliers. */
export const versus = (sweet: HorizonRow, pick: HorizonRow): string => {
  const d = pick.rating;
  const a = ratiosOf(pick);
  const b = ratiosOf(sweet);
  const mult = (x: number, y: number): string =>
    Number.isFinite(x) && Number.isFinite(y) && y > 0 ? `×${fmt(x / y, 2)}` : '—';
  return (
    `vs the sweet spot: damage ${sign(d.dDamage)} % · silver ${sign(d.dSilver)} % · burn ${String(pick.hired - sweet.hired >= 0 ? '+' : '')}${String(pick.hired - sweet.hired)} · ` +
    `gold ${sign(d.dGold)} % · coins ${sign(d.dCoins)} % · queue ${sign(d.dQueue)} % · ` +
    `dmg/silver ${mult(a.silver, b.silver)} · dmg/merc ${mult(a.merc, b.merc)} · dmg/gold ${mult(a.gold, b.gold)} · dmg/coin ${mult(a.coin, b.coin)}`
  );
};

const verdict = (r: ThriftyResult): string =>
  r.pick ? `order ${r.order ?? '?'} · noStopBeaten ${r.noStopBeaten ? '✓' : '✗'}` : '—';

const funnelText = (f: Funnel): string =>
  `pool ${String(f.pool)} → burn ${String(f.burn)} → damage window ${String(f.below)} → queue ${String(f.queue)} → dmg/silver ${String(f.silver)} → dmg/merc ${String(f.merc)} → costs ${String(f.costs)} → rated above the sweet spot ${String(f.rated)}`;

/** One rule run over every army, named for the report. */
export interface Variant {
  name: string;
  /** The rates the rule rates by, for the `rate` column; the app's own when unset. */
  rates?: MarkerRates | undefined;
  /** One line: what the rule is. */
  about: string;
  results: ThriftyResult[];
}

export const billOfRow = (r: HorizonRow): Bill => ({
  damage: r.worst,
  silver: r.silver,
  gold: r.gold,
  hired: r.hired,
  dragonCoins: r.coins,
  seconds: r.seconds,
});

export const countsText = (counts: Record<string, number>): string =>
  Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, c]) => `${id} ${fmt(c)}`)
    .join(', ');

const ordinal = (v: Variant): string =>
  `${String(v.results.filter((t) => t.pick).length)} of ${String(v.results.length)} armies get a pick; ` +
  `${String(v.results.filter((t) => t.pick && t.order === 'strict').length)} strictly in the order, ` +
  `${String(v.results.filter((t) => t.pick && t.order === 'tie-burn').length)} sharing a burn level with a stop, ` +
  `${String(v.results.filter((t) => t.pick && t.order === 'breaks').length)} breaking it.`;

/** The report: a summary table per rule, then one table per army with the bar and every pick in it. */
export function renderThrifty(
  armies: ArmyHorizon[],
  variants: Variant[],
  meta: Record<string, unknown> = {},
): string {
  const out: string[] = [
    '# The thrifty stop — a fifth stop read off the march horizon',
    '',
    Object.entries(meta)
      .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
      .join(' · '),
    '',
    "Every rule starts from the rows the bar could have offered and did not (undominated ∧ in the band ∧ not a stop ∧ not a put-back generator) and is read against the army's sweet spot. Gold is reported, never gated.",
    '',
    ...variants.map((v) => `- **${v.name}** — ${v.about}`),
    '',
    "Rows: HS burn-saver · SS silver-saver · SW sweet spot · MM more-mercs · MX steady max · AI all-in. `order`: `strict` = burn and damage both rise along the bar; `tie-burn` = the pick shares a burn level with a stop, damage rising (the criterion as written refuses a tie); `breaks` = damage or burn falls against a lower rung. Deltas are percent change over the sweet spot; `×` is the pick's ratio over the sweet spot's.",
    '',
    '## Summary',
    '',
  ];
  for (const v of variants) {
    out.push(
      `### ${v.name}`,
      '',
      ordinal(v),
      '',
      '| army | pick | Δdmg % | Δsilver % | Δgold % | Δcoins % | Δqueue % | burn (sweet) | dmg/silver × | dmg/merc × | dmg/gold × | rate | bar with the pick |',
      '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|',
    );
    armies.forEach((army, i) => {
      const t = v.results[i];
      if (!t) return;
      if (!t.pick || !t.sweet) {
        out.push(`| ${army.label} | none | | | | | | ${t.sweet ? String(t.sweet.hired) : '—'} | | | | | |`);
        return;
      }
      const d = t.pick.rating;
      const a = ratiosOf(t.pick);
      const b = ratiosOf(t.sweet);
      const mult = (x: number, y: number): string => (Number.isFinite(x / y) ? fmt(x / y, 2) : '—');
      out.push(
        `| ${army.label} | ${fmt(t.pick.worst)} | ${sign(d.dDamage)} | ${sign(d.dSilver)} | ${sign(d.dGold)} | ${sign(d.dCoins)} | ${sign(d.dQueue)} | ${String(t.pick.hired)} (${String(t.sweet.hired)}) | ${mult(a.silver, b.silver)} | ${mult(a.merc, b.merc)} | ${mult(a.gold, b.gold)} | ${fmt(rate(billOfRow(t.sweet), billOfRow(t.pick), v.rates ?? CAMPAIGN.markerRates), 1)} | ${verdict(t)} |`,
      );
    });
    out.push('');
  }
  out.push('## Per army', '');
  armies.forEach((army, i) => {
    out.push(`### ${army.label}`, '');
    const sweet = variants[0]?.results[i]?.sweet;
    if (!sweet) {
      out.push('No sweet spot on this bar.', '');
      return;
    }
    for (const v of variants)
      out.push(`- ${v.name} funnel: ${funnelText(v.results[i]?.funnel ?? ({} as Funnel))}.`);
    out.push('');
    // One row per distinct pick, named by every rule that chose it.
    const picks = new Map<string, { names: string[]; row: HorizonRow }>();
    for (const v of variants) {
      const pick = v.results[i]?.pick;
      if (!pick) continue;
      const entry = picks.get(pick.key);
      if (entry) entry.names.push(v.name);
      else picks.set(pick.key, { names: [v.name], row: pick });
    }
    const rows = [
      ...army.rows
        .filter((r) => r.marks.stop !== undefined)
        .map((r) => ({ name: short(r.marks.stop ?? ''), row: r })),
      ...[...picks.values()].map((p) => ({ name: `**${p.names.join(' = ')}**`, row: p.row })),
    ].sort((x, y) => x.row.hired - y.row.hired || x.row.worst - y.row.worst);
    out.push(TABLE_HEAD, ...rows.map((r) => tableRow(r.name, r.row, sweet)), '');
    for (const v of variants) {
      const t = v.results[i];
      if (!t?.pick) out.push(`**${v.name}**: no row passes the gates.`, '');
      else
        out.push(
          `**${v.name}** ${versus(sweet, t.pick)}. ${verdict(t)}.`,
          '',
          `  - fields ${countsText(t.pick.counts)}`,
          '',
        );
    }
  });
  return `${out.join('\n')}\n`;
}

// ---- the ratio-floor line (experiment 234) ---------------------------------------------------------------

/** One line of a sweep: a rule moved along one value (a ratio floor, a queue weight), the other settings held. */
export interface SweepLine {
  name: string;
  about: string;
  values: number[];
  /** How a value reads in a column head and in "chosen by". */
  label: (value: number) => string;
  /** `results[v][a]`: the rule at `values[v]` over army `a`. */
  results: ThriftyResult[][];
}

/**
 * The report of a sweep: per line a matrix of army × value (the pick's damage change against the sweet spot, its queue
 * change and its burn), then per army the bar with every distinct pick of the sweep in it, rated against the sweet spot
 * and each pick's troops, and for each pick the values that chose it.
 */
export function renderSweep(
  armies: ArmyHorizon[],
  lines: SweepLine[],
  head: { title: string; intro: string },
  meta: Record<string, unknown> = {},
): string {
  const out: string[] = [
    `# ${head.title}`,
    '',
    Object.entries(meta)
      .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
      .join(' · '),
    '',
    head.intro,
    '',
    ...lines.map((l) => `- **${l.name}** — ${l.about}`),
    '',
    "Rows: HS burn-saver · SS silver-saver · SW sweet spot · MM more-mercs · MX steady max · AI all-in. `rating` is the owner's rating against the sweet spot in the rule's rates (queue 40, gold 10). A matrix cell is `Δdamage % / Δqueue % / burn` of the pick against the sweet spot, `·` for no pick.",
    '',
    '## Matrices',
    '',
  ];
  for (const line of lines) {
    out.push(
      `### ${line.name}`,
      '',
      `| army | ${line.values.map((v) => line.label(v)).join(' | ')} |`,
      `|---|${line.values.map(() => '---:').join('|')}|`,
    );
    armies.forEach((army, a) => {
      const cells = line.values.map((_, v) => {
        const t = line.results[v]?.[a];
        return t?.pick
          ? `${sign(t.pick.rating.dDamage)} / ${sign(t.pick.rating.dQueue)} / ${String(t.pick.hired)}`
          : '·';
      });
      out.push(`| ${army.label} | ${cells.join(' | ')} |`);
    });
    out.push(
      `| **armies with a pick** | ${line.values
        .map((_, v) => String(armies.filter((_a, a) => line.results[v]?.[a]?.pick).length))
        .join(' | ')} |`,
      '',
    );
  }
  out.push('## Per army', '');
  armies.forEach((army, a) => {
    const sweet = lines[0]?.results[0]?.[a]?.sweet;
    if (!sweet) return;
    const picks = new Map<string, { row: HorizonRow; chosen: string[] }>();
    const spans = (line: SweepLine, key: string): string => {
      const at = line.values.filter((_, v) => line.results[v]?.[a]?.pick?.key === key);
      const first = at[0];
      const last = at[at.length - 1];
      return first === undefined || last === undefined
        ? ''
        : `${line.name} ${at.length > 1 ? `${line.label(first)}…${line.label(last)}` : line.label(first)}`;
    };
    for (const line of lines)
      line.values.forEach((_value, v) => {
        const pick = line.results[v]?.[a]?.pick;
        if (!pick) return;
        const entry = picks.get(pick.key) ?? { row: pick, chosen: [] };
        const span = spans(line, pick.key);
        if (!entry.chosen.includes(span)) entry.chosen.push(span);
        picks.set(pick.key, entry);
      });
    out.push(`### ${army.label}`, '');
    if (picks.size === 0) {
      out.push('No pick at any value of any line.', '');
      return;
    }
    const named = [...picks.values()]
      .sort((x, y) => y.row.worst - x.row.worst)
      .map((p, i) => ({ ...p, name: `**pick ${String.fromCharCode(65 + i)}**` }));
    const rows = [
      ...army.rows
        .filter((r) => r.marks.stop !== undefined)
        .map((r) => ({ name: short(r.marks.stop ?? ''), row: r })),
      ...named.map((p) => ({ name: p.name, row: p.row })),
    ].sort((x, y) => x.row.hired - y.row.hired || x.row.worst - y.row.worst);
    out.push(TABLE_HEAD, ...rows.map((r) => tableRow(r.name, r.row, sweet)), '');
    for (const p of named)
      out.push(
        `${p.name} — chosen by ${p.chosen.join('; ')}. ${versus(sweet, p.row)}.`,
        '',
        `  - sweet spot fields ${countsText(sweet.counts)}`,
        `  - ${p.name} fields ${countsText(p.row.counts)}`,
        '',
      );
  });
  return `${out.join('\n')}\n`;
}

// ---- the sweet-spot improvers (experiment 237) ------------------------------------------------------------

/** A damage floor, as a share of the sweet spot's damage, and what it is called in the report. */
export interface ImproverBand {
  name: string;
  floor: number;
}

/** From a row that out-damages the sweet spot to one that gives up a quarter of its damage. */
export const IMPROVER_BANDS: ImproverBand[] = [
  { name: 'up', floor: 1 },
  { name: 'level', floor: 0.9 },
  { name: 'wide', floor: 0.75 },
];

export interface ImproverResult {
  label: string;
  sweet?: HorizonRow | undefined;
  /**
   * Rows better than the sweet spot on damage a silver, on damage a merc (at least `mercFloor` of its) **and** on queue
   * (undominated, in the band, not a stop, not a generator).
   */
  both: HorizonRow[];
  /** The same without the merc condition: what buying damage with mercenaries adds. */
  silverOnly: number;
  mercFloor: number;
  /** Per band: how many of them keep the band's damage, and the one with the best damage a silver and a merc together. */
  bands: { name: string; floor: number; count: number; pick?: HorizonRow | undefined }[];
}

/**
 * The rows that beat the sweet spot on **damage a silver, damage a merc and training time at once**, with no limit on
 * burn or order, and in each damage band the one whose two ratios gain most together (`ln(dmg/silver) + ln(dmg/merc)`
 * over the sweet spot's). `mercFloor` is the share of the sweet spot's damage a merc a row must keep; `1` means it may not
 * fall at all. Reads the horizon, battles nothing.
 */
export function improversOf(
  army: ArmyHorizon,
  mercFloor = 1,
  bands: ImproverBand[] = IMPROVER_BANDS,
): ImproverResult {
  const sweet = army.rows.find((r) => r.marks.stop === 'sweet-spot');
  if (!sweet) return { label: army.label, both: [], silverOnly: 0, mercFloor, bands: [] };
  const base = ratiosOf(sweet);
  const silverOnly = army.rows.filter(
    (r) =>
      r.marks.fifthCandidate &&
      r.marks.generatorOf === undefined &&
      ratiosOf(r).silver > base.silver * 1.0001 &&
      r.seconds < sweet.seconds * 0.9999,
  );
  const both = silverOnly.filter((r) => ratiosOf(r).merc >= base.merc * mercFloor);
  const gain = (r: HorizonRow): number => {
    const q = ratiosOf(r);
    return Math.log(q.silver / base.silver) + Math.log(q.merc / base.merc);
  };
  return {
    label: army.label,
    sweet,
    both,
    silverOnly: silverOnly.length,
    mercFloor,
    bands: bands.map(({ name, floor }) => {
      const kept = both.filter((r) => r.worst >= sweet.worst * floor);
      const pick = [...kept].sort((a, b) => gain(b) - gain(a) || b.worst - a.worst)[0];
      return { name, floor, count: kept.length, pick };
    }),
  };
}

/** The report of the improvers: a summary, then per army the bar with every pick and the rows' troop counts. */
export function renderImprovers(
  armies: ArmyHorizon[],
  results: ImproverResult[],
  meta: Record<string, unknown> = {},
): string {
  const out: string[] = [
    '# The sweet-spot improvers — rows that beat the sweet spot on dmg/silver, dmg/merc and training time',
    '',
    Object.entries(meta)
      .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
      .join(' · '),
    '',
    "An improver is a row the bar did not offer (undominated ∧ in the band ∧ not a stop ∧ not a generator) with a **better damage a silver, a damage a merc no lower, and a shorter queue than the sweet spot**. No limit on burn, on the damage, or on the order. Of them, in each damage band, the one whose **damage a silver and damage a merc gain most together**: `up` keeps at least the sweet spot's damage, `level` at least 90 % of it, `wide` at least 75 %. Gold is shown, never gated; `silver only` counts the rows that would pass without the dmg/merc condition — the damage bought with mercenaries. Rows: HS burn-saver · SS silver-saver · SW sweet spot · MM more-mercs · MX steady max · AI all-in. `rating` is the owner's rating against the sweet spot (queue 40, gold 10).",
    '',
    '## Summary',
    '',
    '| army | improvers | silver only (no merc condition) | up (≥100 %) | level (≥90 %) | wide (≥75 %) |',
    '|---|---:|---:|---|---|---|',
  ];
  const cell = (r: ImproverResult, band: string): string => {
    const b = r.bands.find((x) => x.name === band);
    if (!b?.pick || !r.sweet) return `${String(b?.count ?? 0)} · none`;
    const q = ratiosOf(b.pick);
    const s = ratiosOf(r.sweet);
    return `${String(b.count)} · dmg ${sign(b.pick.rating.dDamage)} % · queue ${sign(b.pick.rating.dQueue)} % · burn ${String(b.pick.hired)} (${String(r.sweet.hired)}) · dmg/silver ×${fmt(q.silver / s.silver, 2)} · dmg/merc ×${fmt(q.merc / s.merc, 2)}`;
  };
  armies.forEach((army, i) => {
    const r = results[i];
    if (!r) return;
    out.push(
      `| ${army.label} | ${String(r.both.length)} | ${String(r.silverOnly)} | ${cell(r, 'up')} | ${cell(r, 'level')} | ${cell(r, 'wide')} |`,
    );
  });
  out.push('', '## Per army', '');
  armies.forEach((army, i) => {
    const r = results[i];
    if (!r?.sweet) return;
    out.push(
      `### ${army.label}`,
      '',
      `${String(r.both.length)} rows beat the sweet spot on dmg/silver, dmg/merc and queue (${String(r.silverOnly)} on dmg/silver and queue alone).`,
      '',
    );
    if (r.both.length === 0) return;
    const picks = new Map<string, { row: HorizonRow; names: string[] }>();
    for (const b of r.bands) {
      if (!b.pick) continue;
      const entry = picks.get(b.pick.key) ?? { row: b.pick, names: [] };
      entry.names.push(b.name);
      picks.set(b.pick.key, entry);
    }
    const named = [...picks.values()].map((p) => ({ ...p, name: `**${p.names.join(' = ')}**` }));
    const rows = [
      ...army.rows
        .filter((x) => x.marks.stop !== undefined)
        .map((x) => ({ name: short(x.marks.stop ?? ''), row: x })),
      ...named.map((p) => ({ name: p.name, row: p.row })),
    ].sort((x, y) => x.row.hired - y.row.hired || x.row.worst - y.row.worst);
    out.push(TABLE_HEAD, ...rows.map((x) => tableRow(x.name, x.row, r.sweet as HorizonRow)), '');
    for (const p of named) out.push(`${p.name} ${versus(r.sweet, p.row)}.`, '');
  });
  return `${out.join('\n')}\n`;
}
